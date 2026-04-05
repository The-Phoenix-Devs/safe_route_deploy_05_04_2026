
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NewGuardian } from './types';

interface GuardianFormProps {
  guardian: NewGuardian;
  setGuardian: React.Dispatch<React.SetStateAction<NewGuardian>>;
  onAdd: () => void;
}

const GuardianForm: React.FC<GuardianFormProps> = ({ 
  guardian, 
  setGuardian, 
  onAdd 
}) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={guardian.name}
          onChange={(e) => setGuardian({...guardian, name: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          value={guardian.email}
          onChange={(e) => setGuardian({...guardian, email: e.target.value})} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          value={guardian.phone}
          onChange={(e) => setGuardian({...guardian, phone: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input 
          id="address" 
          value={guardian.address}
          onChange={(e) => setGuardian({...guardian, address: e.target.value})}
        />
      </div>
      <Button onClick={onAdd} className="w-full">
        Add Guardian
      </Button>
    </div>
  );
};

export default GuardianForm;
