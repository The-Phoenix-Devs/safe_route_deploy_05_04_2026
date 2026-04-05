import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Driver } from '@/services/driverService';
import DriverFormSupabase from './DriverFormSupabase';

interface EditDriverDialogProps {
  driver: Driver;
  onUpdate: (id: string, data: any) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

const EditDriverDialog: React.FC<EditDriverDialogProps> = ({
  driver,
  onUpdate,
  onClose,
  open,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>
        <DriverFormSupabase
          onSubmit={(data) => onUpdate(driver.id, data)}
          onCancel={onClose}
          initialData={driver}
          isEdit={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverDialog;