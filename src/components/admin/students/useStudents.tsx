
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { generateCredentials } from '@/utils/authUtils';
import { Student, Driver } from './types';
import { 
  createStudent, 
  getStudents, 
  updateStudent, 
  deleteStudent,
  getDrivers,
  createGuardianCredentials,
  registerUser
} from '@/services/firebase';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({
    name: '',
    grade: '',
    guardianName: '',
    pickupPoint: '',
    busNumber: '',
    driverId: ''
  });
  
  const { toast } = useToast();

  // Load data from Firebase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch students from Firebase
        const studentsData = await getStudents();
        setStudents(studentsData as Student[]);
        
        // Fetch drivers from Firebase
        const driversData = await getDrivers();
        setDrivers(driversData as Driver[]);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: error.message || "Failed to load student and driver data"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  const handleAddStudent = async () => {
    // Generate guardian credentials based on the student's name for stronger association
    const guardianCredentials = generateCredentials(newStudent.name, 'guardian');
    
    try {
      // Create a new student in Firebase
      const studentId = await createStudent({
        name: newStudent.name,
        grade: newStudent.grade,
        guardianName: newStudent.guardianName,
        pickupPoint: newStudent.pickupPoint,
        busNumber: newStudent.busNumber,
        driverId: newStudent.driverId
      });
      
      // Create guardian credentials in Firebase
      await createGuardianCredentials({
        username: guardianCredentials.username,
        password: guardianCredentials.password,
        studentId,
        role: 'guardian'
      });

      // Try to register the guardian user in Firebase Auth
      try {
        const email = `${guardianCredentials.username}@example.com`; // Generate an email for Auth
        await registerUser(
          email,
          guardianCredentials.password,
          newStudent.guardianName,
          'guardian',
          guardianCredentials.username
        );
      } catch (authError) {
        console.error("Could not create guardian auth account:", authError);
        // Continue even if auth creation fails - this is a fallback
      }
      
      // Add the new student to the state
      const newStudentWithData: Student = {
        id: studentId,
        name: newStudent.name,
        grade: newStudent.grade,
        guardianName: newStudent.guardianName,
        pickupPoint: newStudent.pickupPoint,
        busNumber: newStudent.busNumber,
        driverId: newStudent.driverId,
        guardianUsername: guardianCredentials.username,
        guardianPassword: guardianCredentials.password
      };
      
      setStudents([...students, newStudentWithData]);
      
      // Reset the form
      setNewStudent({
        name: '',
        grade: '',
        guardianName: '',
        pickupPoint: '',
        busNumber: '',
        driverId: ''
      });
      
      toast({
        title: 'Success',
        description: `New student added with guardian account (${guardianCredentials.username})`,
      });
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast({
        variant: "destructive",
        title: "Error adding student",
        description: error.message || "An unknown error occurred"
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteStudent(id);
      
      // Update the UI
      setStudents(students.filter(student => student.id !== id));
      
      toast({
        title: 'Success',
        description: 'Student and associated guardian account deleted successfully',
      });
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete student"
      });
    }
  };

  const handleManageCredentials = (student: Student) => {
    setSelectedStudent(student);
    setIsCredentialDialogOpen(true);
  };

  const handleCredentialUpdateSuccess = () => {
    setIsCredentialDialogOpen(false);
    
    if (selectedStudent) {
      toast({
        title: "Success",
        description: `Credentials for ${selectedStudent.guardianName}'s account updated`,
      });
    }
  };

  return {
    students,
    drivers,
    loading,
    searchTerm,
    setSearchTerm,
    newStudent,
    setNewStudent,
    selectedStudent,
    isCredentialDialogOpen,
    setIsCredentialDialogOpen,
    handleAddStudent,
    handleDeleteStudent,
    handleManageCredentials,
    handleCredentialUpdateSuccess
  };
};

export default useStudents;
