
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Guardian, NewGuardian } from './types';

// Mock data for guardians (later replace with API calls)
const mockGuardians: Guardian[] = [
  { id: '1', name: 'Robert Johnson', email: 'robert@example.com', phone: '555-1111', address: '123 Main St', children: ['Alice Johnson'] },
  { id: '2', name: 'Mary Smith', email: 'mary@example.com', phone: '555-2222', address: '456 Oak St', children: ['Bob Smith'] },
  { id: '3', name: 'Lucy Brown', email: 'lucy@example.com', phone: '555-3333', address: '789 Pine St', children: ['Charlie Brown'] },
];

export const useGuardians = () => {
  const [guardians, setGuardians] = useState<Guardian[]>(mockGuardians);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGuardian, setNewGuardian] = useState<NewGuardian>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const { toast } = useToast();

  const handleAddGuardian = () => {
    // Here would be the actual API implementation
    const id = Math.random().toString(36).substr(2, 9);
    const guardian = { ...newGuardian, id, children: [] };
    setGuardians([...guardians, guardian as Guardian]);
    
    // Reset form
    setNewGuardian({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    
    toast({
      title: 'Success',
      description: 'New guardian added successfully',
    });
  };

  const handleDeleteGuardian = (id: string) => {
    // Here would be the actual API implementation
    setGuardians(guardians.filter(guardian => guardian.id !== id));
    toast({
      title: 'Success',
      description: 'Guardian deleted successfully',
    });
  };

  return {
    guardians,
    searchTerm,
    setSearchTerm,
    newGuardian,
    setNewGuardian,
    handleAddGuardian,
    handleDeleteGuardian
  };
};

export default useGuardians;
