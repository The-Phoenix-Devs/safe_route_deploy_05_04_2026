
import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { Guardian } from '@/hooks/useSupabaseGuardians';
import { WhatsAppPortalCredentialsButton } from '@/components/admin/WhatsAppPortalCredentialsButton';
import { guardianLoginReminderMessage } from '@/utils/whatsappInvite';

interface GuardianListProps {
  guardians: Guardian[];
  searchTerm: string;
  loginOrigin: string;
  loading?: boolean;
  onDelete: (id: string) => void;
}

const GuardianList: React.FC<GuardianListProps> = ({ 
  guardians, 
  searchTerm,
  loginOrigin,
  loading,
  onDelete 
}) => {
  const filteredGuardians = guardians.filter(guardian => 
    guardian.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    guardian.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guardian.mobile_number && guardian.mobile_number.includes(searchTerm))
  );

  if (loading) {
    return <div className="text-center py-4">Loading guardians...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Mobile Number</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredGuardians.map((guardian) => {
          const waPhone = guardian.mobile_number || guardian.username;
          return (
          <TableRow key={guardian.id}>
            <TableCell>{guardian.username}</TableCell>
            <TableCell>{guardian.email}</TableCell>
            <TableCell>{guardian.mobile_number || 'N/A'}</TableCell>
            <TableCell>{guardian.students?.length || 0} students</TableCell>
            <TableCell>{new Date(guardian.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <WhatsAppPortalCredentialsButton
                  phone={waPhone}
                  profileId={guardian.id}
                  buildMessage={(pin) =>
                    guardianLoginReminderMessage({
                      guardianName: guardian.username,
                      username: guardian.username,
                      loginOrigin,
                      pin,
                    })
                  }
                  title="Send guardian login details via WhatsApp"
                />
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDelete(guardian.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
        })}
      </TableBody>
    </Table>
  );
};

export default GuardianList;
