
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudentList } from './useStudentList';
import StudentSearch from './StudentSearch';
import StudentItem from './StudentItem';
import { StudentCheckListProps } from './types';

const StudentCheckList: React.FC<StudentCheckListProps> = ({ isActive, journeyType = 'none' }) => {
  const { searchTerm, setSearchTerm, filteredStudents, handleCheckInOut, loading } = useStudentList(isActive, journeyType);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Student Check-in/out</span>
          <StudentSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading students...</p>
            </div>
          ) : (
            <>
              {filteredStudents.map(student => (
                <StudentItem 
                  key={student.id}
                  student={student}
                  isActive={isActive}
                  journeyType={journeyType}
                  onCheckInOut={handleCheckInOut}
                />
              ))}
              
              {filteredStudents.length === 0 && (
                <p className="text-center py-4 text-gray-500">
                  {searchTerm ? 'No students found matching your search.' : 'No students assigned to this bus.'}
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCheckList;
