import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseDrivers } from '@/hooks/useSupabaseDrivers';
import { Student } from '@/hooks/useSupabaseStudents';

const CLASS_OPTIONS = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

export interface CreateStudentData {
  name: string;
  grade: string;
  guardian_name: string;
  guardian_mobile: string;
  pickup_point: string;
  driver_id: string;
  bus_number: string;
}

interface StudentFormSupabaseProps {
  onSubmit: (data: CreateStudentData) => Promise<void>;
  onCancel: () => void;
  initialData?: Student;
  isEdit?: boolean;
}

const StudentFormSupabase: React.FC<StudentFormSupabaseProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<CreateStudentData>({
    name: initialData?.name || '',
    grade: initialData?.grade || '',
    guardian_name: initialData?.guardian_name || '',
    guardian_mobile: initialData?.guardian_mobile || '',
    pickup_point: initialData?.pickup_point || '',
    driver_id: initialData?.driver_id || '',
    bus_number: initialData?.bus_number || '',
  });
  const [loading, setLoading] = useState(false);
  const { drivers } = useSupabaseDrivers();

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find(d => d.id === driverId);
    setFormData(prev => ({
      ...prev,
      driver_id: driverId,
      bus_number: selectedDriver?.bus_number || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Student Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter student name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="grade">Class/Grade *</Label>
        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))} value={formData.grade}>
          <SelectTrigger>
            <SelectValue placeholder="Select class/grade" />
          </SelectTrigger>
          <SelectContent>
            {CLASS_OPTIONS.map((classOption) => (
              <SelectItem key={classOption} value={classOption}>
                {classOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="guardian_name">Guardian Name *</Label>
        <Input
          id="guardian_name"
          value={formData.guardian_name}
          onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
          placeholder="Enter guardian name"
          required
        />
      </div>

      <div>
        <Label htmlFor="guardian_mobile">Guardian Mobile Number *</Label>
        <Input
          id="guardian_mobile"
          value={formData.guardian_mobile}
          onChange={(e) => setFormData(prev => ({ ...prev, guardian_mobile: e.target.value }))}
          placeholder="Enter 10-digit mobile number"
          maxLength={10}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="pickup_point">Pickup Point *</Label>
        <Input
          id="pickup_point"
          value={formData.pickup_point}
          onChange={(e) => setFormData(prev => ({ ...prev, pickup_point: e.target.value }))}
          placeholder="Enter pickup point"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="driver">Driver *</Label>
        <Select onValueChange={handleDriverChange} value={formData.driver_id}>
          <SelectTrigger>
            <SelectValue placeholder="Select a driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name} - Bus #{driver.bus_number}
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
          {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Student' : 'Create Student')}
        </Button>
      </div>
    </form>
  );
};

export default StudentFormSupabase;