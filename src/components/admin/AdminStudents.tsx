
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import StudentListSupabase from './students/StudentListSupabase';
import StudentFormSupabase from './students/StudentFormSupabase';
import StudentSearch from './students/StudentSearch';
import { useSupabaseStudents } from '@/hooks/useSupabaseStudents';
import { useSupabaseDrivers } from '@/hooks/useSupabaseDrivers';
import EditStudentDialog from './students/EditStudentDialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  GuardianPostCreateDialog,
  type GuardianPostCreatePayload,
} from './students/GuardianPostCreateDialog';

const AdminStudents: React.FC = () => {
  const { students, loading, addStudent, updateStudent, deleteStudent } = useSupabaseStudents();
  const { drivers } = useSupabaseDrivers();
  const [loginOrigin, setLoginOrigin] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingStudent, setEditingStudent] = React.useState<any>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{open: boolean, student: any}>({open: false, student: null});
  const [guardianShare, setGuardianShare] = React.useState<GuardianPostCreatePayload | null>(null);
  const [guardianShareOpen, setGuardianShareOpen] = React.useState(false);

  const handleAddStudent = async (data: any) => {
    try {
      const created = await addStudent(data);
      setShowAddForm(false);
      const pin =
        created &&
        "initial_portal_pin" in created &&
        typeof (created as { initial_portal_pin?: string }).initial_portal_pin === "string"
          ? (created as { initial_portal_pin: string }).initial_portal_pin
          : undefined;
      setGuardianShare({
        guardianName: data.guardian_name,
        studentName: data.name,
        mobile: data.guardian_mobile,
        pickup: data.pickup_point,
        bus: data.bus_number?.trim() || undefined,
        pin,
      });
      setGuardianShareOpen(true);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      setDeleteConfirm({open: true, student});
    }
  };

  const confirmDeleteStudent = async () => {
    if (deleteConfirm.student) {
      try {
        await deleteStudent(deleteConfirm.student.id);
        setDeleteConfirm({open: false, student: null});
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
  };

  const handleUpdateStudent = async (id: string, data: any) => {
    try {
      await updateStudent(id, data);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleCloseEditDialog = () => {
    setEditingStudent(null);
  };

  React.useEffect(() => {
    setLoginOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Students</h2>
        <div className="flex space-x-2">
          <StudentSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <StudentFormSupabase 
                onSubmit={handleAddStudent}
                onCancel={() => setShowAddForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <StudentListSupabase 
        students={students}
        drivers={drivers}
        searchTerm={searchTerm}
        loginOrigin={loginOrigin}
        onDelete={handleDeleteStudent}
        onEdit={handleEditStudent}
      />
      
      {editingStudent && (
        <EditStudentDialog
          student={editingStudent}
          onUpdate={handleUpdateStudent}
          onClose={handleCloseEditDialog}
          open={!!editingStudent}
        />
      )}

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({open, student: null})}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteConfirm.student?.name}? This will permanently remove the student, and if this is the guardian's only child, their profile and all associated data will also be deleted. This action cannot be undone.`}
        onConfirm={confirmDeleteStudent}
      />

      <GuardianPostCreateDialog
        open={guardianShareOpen}
        data={guardianShare}
        onClose={() => {
          setGuardianShareOpen(false);
          setGuardianShare(null);
        }}
      />
    </div>
  );
};

export default AdminStudents;
