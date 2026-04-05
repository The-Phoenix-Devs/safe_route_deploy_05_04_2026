import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Student } from '@/hooks/useSupabaseStudents';
import StudentFormSupabase from './StudentFormSupabase';

interface EditStudentDialogProps {
  student: Student;
  onUpdate: (id: string, data: any) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

const EditStudentDialog: React.FC<EditStudentDialogProps> = ({
  student,
  onUpdate,
  onClose,
  open,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <StudentFormSupabase
          onSubmit={(data) => onUpdate(student.id, data)}
          onCancel={onClose}
          initialData={student}
          isEdit={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;