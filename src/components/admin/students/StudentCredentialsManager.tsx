
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';

interface StudentCredentialsManagerProps {
  studentId: string;
  guardianUsername?: string;
  guardianPassword?: string;
  onManage: (studentId: string) => void;
}

const StudentCredentialsManager: React.FC<StudentCredentialsManagerProps> = ({
  studentId,
  guardianUsername,
  guardianPassword,
  onManage
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setShowCredentials(!showCredentials)}
      >
        <Key className="h-3.5 w-3.5" />
        {showCredentials ? 'Hide' : 'Show'}
      </Button>
      
      {showCredentials && guardianUsername && guardianPassword && (
        <div className="mt-1 text-xs">
          <p>Username: {guardianUsername}</p>
          <p>Password: {guardianPassword}</p>
        </div>
      )}
      
      <Button
        variant="secondary"
        size="sm"
        className="flex items-center gap-1 mt-1"
        onClick={() => onManage(studentId)}
      >
        <Key className="h-3.5 w-3.5" />
        Manage
      </Button>
    </div>
  );
};

export default StudentCredentialsManager;
