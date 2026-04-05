
import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { Student, Driver } from './types';
import StudentCredentialsManager from './StudentCredentialsManager';

interface StudentListProps {
  students: Student[];
  drivers: Driver[];
  searchTerm: string;
  onDelete: (id: string) => void;
  onManageCredentials: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  drivers,
  searchTerm,
  onDelete,
  onManageCredentials
}) => {
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.guardianName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Guardian</TableHead>
          <TableHead>Pickup Point</TableHead>
          <TableHead>Bus Number</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Guardian Credentials</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredStudents.map((student) => (
          <TableRow key={student.id}>
            <TableCell>{student.name}</TableCell>
            <TableCell>{student.grade}</TableCell>
            <TableCell>{student.guardianName}</TableCell>
            <TableCell>{student.pickupPoint}</TableCell>
            <TableCell>{student.busNumber}</TableCell>
            <TableCell>
              {drivers.find(d => d.id === student.driverId)?.name || 'Not assigned'}
            </TableCell>
            <TableCell>
              <StudentCredentialsManager
                studentId={student.id}
                guardianUsername={student.guardianUsername}
                guardianPassword={student.guardianPassword}
                onManage={() => onManageCredentials(student)}
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDelete(student.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StudentList;
