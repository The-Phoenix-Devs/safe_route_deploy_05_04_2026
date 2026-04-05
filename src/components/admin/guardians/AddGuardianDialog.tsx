
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { NewGuardian } from './types';
import GuardianForm from './GuardianForm';

interface AddGuardianDialogProps {
  newGuardian: NewGuardian;
  setNewGuardian: React.Dispatch<React.SetStateAction<NewGuardian>>;
  onAdd: () => void;
}

const AddGuardianDialog: React.FC<AddGuardianDialogProps> = ({
  newGuardian,
  setNewGuardian,
  onAdd
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Guardian
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Guardian</DialogTitle>
        </DialogHeader>
        <GuardianForm 
          guardian={newGuardian}
          setGuardian={setNewGuardian}
          onAdd={onAdd}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddGuardianDialog;
