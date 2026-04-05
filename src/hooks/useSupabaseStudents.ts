import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isAdminPanelUser } from '@/utils/adminAccess';

export interface Student {
  id: string;
  name: string;
  grade: string;
  guardian_name: string;
  guardian_mobile: string | null;
  guardian_profile_id?: string | null;
  pickup_point: string;
  driver_id: string | null;
  bus_number: string | null;
  created_at: string;
  updated_at: string;
  guardian_profile?: {
    username: string;
  };
}

export interface CreateStudentData {
  name: string;
  grade: string;
  guardian_name: string;
  guardian_mobile: string;
  pickup_point: string;
  driver_id: string;
  bus_number: string;
}

export const useSupabaseStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          guardian_profile:guardian_profile_id (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: CreateStudentData) => {
    try {
      console.log('Starting student creation process with data:', studentData);
      
      // Use the studentService which handles both Supabase and Firebase integration
      const { createStudent } = await import('@/services/studentService');
      
      const student = await createStudent({
        name: studentData.name,
        grade: studentData.grade,
        guardian_name: studentData.guardian_name,
        guardian_mobile: studentData.guardian_mobile,
        pickup_point: studentData.pickup_point,
        driver_id: studentData.driver_id,
        bus_number: studentData.bus_number,
      });

      console.log('Student created successfully:', student);

      // Refresh the students list to include the new student
      await fetchStudents();

      const issuedPin =
        "initial_portal_pin" in student && typeof (student as { initial_portal_pin?: string }).initial_portal_pin === "string"
          ? (student as { initial_portal_pin: string }).initial_portal_pin
          : undefined;

      toast({
        title: "Success",
        description: issuedPin
          ? "Student added. Use the dialog to WhatsApp the guardian with mobile and PIN."
          : "Student and guardian account created successfully.",
      });

      return student;
    } catch (error) {
      console.error('Error adding student:', error);
      
      // More specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Error',
        description: `Failed to add student: ${errorMessage}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateStudent = async (id: string, studentData: Partial<CreateStudentData>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(student => 
        student.id === id ? { ...student, ...data } : student
      ));
      
      toast({
        title: 'Success',
        description: 'Student updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      // Get current user from localStorage to verify admin access
      const storedUser = localStorage.getItem('sishu_tirtha_user');
      if (!storedUser) {
        throw new Error('User not authenticated');
      }
      
      const userData = JSON.parse(storedUser);
      if (!isAdminPanelUser(userData.user_type)) {
        throw new Error('Access denied. Admin privileges required.');
      }

      const { data, error } = await supabase
        .rpc('delete_student_and_cleanup', { student_id_param: id });

      if (error) throw error;

      if (!data) {
        throw new Error('Student not found');
      }

      setStudents(prev => prev.filter(student => student.id !== id));
      toast({
        title: 'Success',
        description: 'Student and related data deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents,
  };
};