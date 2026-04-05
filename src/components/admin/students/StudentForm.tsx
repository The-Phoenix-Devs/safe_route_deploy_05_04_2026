
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Driver } from './types';

interface StudentFormProps {
  newStudent: {
    name: string;
    grade: string;
    guardianName: string;
    pickupPoint: string;
    busNumber: string;
    driverId: string;
  };
  setNewStudent: React.Dispatch<React.SetStateAction<{
    name: string;
    grade: string;
    guardianName: string;
    pickupPoint: string;
    busNumber: string;
    driverId: string;
  }>>;
  drivers: Driver[];
  onAdd: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ 
  newStudent, 
  setNewStudent, 
  drivers, 
  onAdd 
}) => {
  
  // Update bus number when driver changes
  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setNewStudent({
        ...newStudent,
        driverId,
        busNumber: driver.busNumber
      });
    }
  };
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Student Full Name</Label>
        <Input 
          id="name" 
          value={newStudent.name}
          onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="grade">Grade/Class</Label>
        <Input 
          id="grade"
          value={newStudent.grade}
          onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guardianName">Guardian Name</Label>
        <Input 
          id="guardianName" 
          value={newStudent.guardianName}
          onChange={(e) => setNewStudent({...newStudent, guardianName: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pickupPoint">Pickup Point</Label>
        <Input 
          id="pickupPoint" 
          value={newStudent.pickupPoint}
          onChange={(e) => setNewStudent({...newStudent, pickupPoint: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="driver">Assign Driver</Label>
        <Select 
          value={newStudent.driverId || undefined} 
          onValueChange={handleDriverChange}
        >
          <SelectTrigger id="driver">
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map(driver => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name} - {driver.busNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Bus number will be automatically assigned based on the driver
        </p>
      </div>
      <Button onClick={onAdd} className="w-full">
        Add Student
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        A guardian account will be automatically created for the student
      </p>
    </div>
  );
};

export default StudentForm;
