
import React, { useState, useEffect } from 'react';
import GuardianSearch from './guardians/GuardianSearch';
import GuardianList from './guardians/GuardianList';
import AddGuardianDialogSupabase from './guardians/AddGuardianDialogSupabase';
import { useSupabaseGuardians } from '@/hooks/useSupabaseGuardians';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const AdminGuardians: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loginOrigin, setLoginOrigin] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, guardian: any}>({open: false, guardian: null});
  const { guardians, loading, addGuardian, deleteGuardian } = useSupabaseGuardians();

  useEffect(() => {
    setLoginOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  const handleDeleteGuardian = (id: string) => {
    const guardian = guardians.find(g => g.id === id);
    if (guardian) {
      setDeleteConfirm({open: true, guardian});
    }
  };

  const confirmDeleteGuardian = async () => {
    if (deleteConfirm.guardian) {
      await deleteGuardian(deleteConfirm.guardian.id);
      setDeleteConfirm({open: false, guardian: null});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Guardians</h2>
        <div className="flex space-x-2">
          <GuardianSearch 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
          
          <AddGuardianDialogSupabase 
            onAdd={addGuardian}
          />
        </div>
      </div>
      
      <GuardianList 
        guardians={guardians} 
        searchTerm={searchTerm}
        loginOrigin={loginOrigin}
        loading={loading}
        onDelete={handleDeleteGuardian} 
      />

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({open, guardian: null})}
        title="Delete Guardian"
        description={`Are you sure you want to delete ${deleteConfirm.guardian?.username}? This action cannot be undone.`}
        onConfirm={confirmDeleteGuardian}
      />
    </div>
  );
};

export default AdminGuardians;
