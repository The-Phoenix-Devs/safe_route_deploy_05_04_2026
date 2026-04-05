import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseRoutes } from '@/hooks/useSupabaseRoutes';
import { useSupabaseDrivers } from '@/hooks/useSupabaseDrivers';
import { Driver } from '@/services/driverService';

interface CreateDriverParams {
  name: string;
  mobile_number: string;
  phone?: string;
  license_number?: string;
  bus_number: string;
  route_id?: string;
}

interface DriverFormSupabaseProps {
  onSubmit: (data: CreateDriverParams) => Promise<any>;
  onCancel: () => void;
  initialData?: Driver;
  isEdit?: boolean;
}

const DriverFormSupabase: React.FC<DriverFormSupabaseProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<CreateDriverParams>({
    name: initialData?.name || '',
    mobile_number: initialData?.mobile_number || '',
    bus_number: initialData?.bus_number || '',
    license_number: initialData?.license_number || '',
    route_id: initialData?.route_id || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { routes } = useSupabaseRoutes();
  const { drivers } = useSupabaseDrivers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Import validation utilities
    const { validateName, validatePhone, validateBusNumber, validateLicenseNumber, sanitizeInput } = await import('@/utils/validation');
    
    // Validate all required fields
    const nameValidation = validateName(formData.name);
    const phoneValidation = validatePhone(formData.mobile_number);
    const busValidation = validateBusNumber(formData.bus_number);
    
    if (!nameValidation.isValid) {
      toast({
        title: "Validation Error",
        description: nameValidation.error,
        variant: "destructive",
      });
      return;
    }
    
    if (!phoneValidation.isValid) {
      toast({
        title: "Validation Error", 
        description: phoneValidation.error,
        variant: "destructive",
      });
      return;
    }
    
    if (!busValidation.isValid) {
      toast({
        title: "Validation Error",
        description: busValidation.error,
        variant: "destructive",
      });
      return;
    }
    
    // Validate license if provided
    if (formData.license_number) {
      const licenseValidation = validateLicenseNumber(formData.license_number);
      if (!licenseValidation.isValid) {
        toast({
          title: "Validation Error",
          description: licenseValidation.error,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);
      
      // Sanitize inputs before submission
      const sanitizedData = {
        ...formData,
        name: sanitizeInput(formData.name),
        mobile_number: sanitizeInput(formData.mobile_number),
        bus_number: sanitizeInput(formData.bus_number),
        license_number: formData.license_number ? sanitizeInput(formData.license_number) : undefined
      };
      
      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create driver",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter driver name"
          required
        />
      </div>

      <div>
        <Label htmlFor="mobile_number">Mobile Number *</Label>
        <Input
          id="mobile_number"
          value={formData.mobile_number}
          onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
          placeholder="Enter 10-digit mobile number"
          maxLength={10}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="license">License Number</Label>
        <Input
          id="license"
          value={formData.license_number}
          onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
          placeholder="Enter license number (optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="bus">Bus Number *</Label>
        <Input
          id="bus"
          value={formData.bus_number}
          onChange={(e) => setFormData(prev => ({ ...prev, bus_number: e.target.value }))}
          placeholder="Enter bus number"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="route">Assigned Route</Label>
        <Select 
          value={formData.route_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, route_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a route (optional)" />
          </SelectTrigger>
          <SelectContent>
            {routes.map((route) => (
              <SelectItem key={route.id} value={route.id}>
                {route.name} - {route.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Driver' : 'Create Driver')}
        </Button>
      </div>
    </form>
  );
};

export default DriverFormSupabase;