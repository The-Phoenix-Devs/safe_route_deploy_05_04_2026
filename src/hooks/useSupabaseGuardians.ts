import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Guardian {
  id: string;
  email: string;
  mobile_number: string | null;
  username: string;
  user_type: string;
  created_at: string;
  updated_at: string;
  students?: Student[];
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  pickup_point: string;
  guardian_name: string;
  guardian_mobile: string | null;
}

export interface CreateGuardianData {
  email: string;
  username: string;
  mobile_number: string;
}

export const useSupabaseGuardians = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGuardians = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          students:students!guardian_profile_id(*)
        `)
        .eq('user_type', 'guardian')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuardians(data || []);
    } catch (error) {
      console.error('Error fetching guardians:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch guardians',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addGuardian = async (guardianData: CreateGuardianData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          email: guardianData.email,
          username: guardianData.username,
          mobile_number: guardianData.mobile_number,
          user_type: 'guardian',
          firebase_uid: `guardian_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }])
        .select()
        .single();

      if (error) throw error;

      setGuardians(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Guardian added successfully',
      });

      return data;
    } catch (error) {
      console.error('Error adding guardian:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add guardian';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteGuardian = async (id: string) => {
    try {
      // Check if guardian has students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name')
        .eq('guardian_profile_id', id);

      if (studentError) throw studentError;

      if (studentData && studentData.length > 0) {
        toast({
          title: 'Cannot Delete Guardian',
          description: `This guardian has ${studentData.length} student(s) assigned. Please reassign or delete the students first.`,
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGuardians(prev => prev.filter(guardian => guardian.id !== id));
      toast({
        title: 'Success',
        description: 'Guardian deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting guardian:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete guardian',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateGuardian = async (id: string, guardianData: Partial<CreateGuardianData>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(guardianData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGuardians(prev => prev.map(guardian => 
        guardian.id === id ? { ...guardian, ...data } : guardian
      ));
      
      toast({
        title: 'Success',
        description: 'Guardian updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating guardian:', error);
      toast({
        title: 'Error',
        description: 'Failed to update guardian',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  return {
    guardians,
    loading,
    addGuardian,
    updateGuardian,
    deleteGuardian,
    refetch: fetchGuardians,
  };
};