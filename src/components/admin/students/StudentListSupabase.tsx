import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Student } from '@/hooks/useSupabaseStudents';
import { Driver } from '@/services/driverService';
import { WhatsAppShareButton } from '@/components/ui/whatsapp-share-button';
import { WhatsAppPortalCredentialsButton } from '@/components/admin/WhatsAppPortalCredentialsButton';
import { guardianLoginReminderMessage } from '@/utils/whatsappInvite';

interface StudentListProps {
  students: Student[];
  drivers: Driver[];
  searchTerm: string;
  loginOrigin: string;
  onDelete: (id: string) => void;
  onEdit: (student: Student) => void;
}

const StudentListSupabase: React.FC<StudentListProps> = ({
  students,
  drivers,
  searchTerm,
  loginOrigin,
  onDelete,
  onEdit
}) => {
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.guardian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Guardian</TableHead>
            <TableHead>Guardian Username</TableHead>
            <TableHead>Pickup Point</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Bus Number</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No students found
              </TableCell>
            </TableRow>
          ) : (
            filteredStudents.map((student) => {
              const gUser =
                student.guardian_profile?.username ||
                student.guardian_mobile ||
                "";
              const waMsg = guardianLoginReminderMessage({
                guardianName: student.guardian_name,
                studentName: student.name,
                username: gUser || "—",
                loginOrigin,
                pin: null,
              });
              return (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{student.guardian_name}</TableCell>
                <TableCell>
                  {student.guardian_profile?.username || 'N/A'}
                </TableCell>
                <TableCell>{student.pickup_point}</TableCell>
                <TableCell>
                  {drivers.find(d => d.id === student.driver_id)?.name || 'Not Assigned'}
                </TableCell>
                <TableCell>
                  {student.bus_number ? (
                    <Badge variant="outline">{student.bus_number}</Badge>
                  ) : (
                    'Not Assigned'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {student.guardian_profile_id ? (
                      <WhatsAppPortalCredentialsButton
                        phone={student.guardian_mobile}
                        profileId={student.guardian_profile_id}
                        buildMessage={(pin) =>
                          guardianLoginReminderMessage({
                            guardianName: student.guardian_name,
                            studentName: student.name,
                            username: gUser || "—",
                            loginOrigin,
                            pin,
                          })
                        }
                        title="Send guardian login details via WhatsApp"
                      />
                    ) : (
                      <WhatsAppShareButton
                        phone={student.guardian_mobile}
                        message={waMsg}
                        title="Send guardian login details via WhatsApp"
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(student)}
                      title="Edit Student"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(student.id)}
                      title="Delete Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StudentListSupabase;