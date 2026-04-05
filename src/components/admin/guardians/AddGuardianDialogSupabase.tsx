import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { CreateGuardianData } from '@/hooks/useSupabaseGuardians';
import GuardianFormSupabase from './GuardianFormSupabase';

interface AddGuardianDialogSupabaseProps {
  onAdd: (data: CreateGuardianData) => Promise<any>;
}

const AddGuardianDialogSupabase: React.FC<AddGuardianDialogSupabaseProps> = ({
  onAdd
}) => {
  const [open, setOpen] = useState(false);

  const handleAdd = async (data: CreateGuardianData) => {
    await onAdd(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Guardian
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Guardian</DialogTitle>
        </DialogHeader>
        <GuardianFormSupabase 
          onSubmit={handleAdd}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddGuardianDialogSupabase;