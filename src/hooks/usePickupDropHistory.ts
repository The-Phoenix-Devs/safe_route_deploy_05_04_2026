import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PickupDropEvent {
  id: string;
  student_id: string;
  student_name: string;
  driver_name: string;
  event_type: 'pickup' | 'drop';
  event_time: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  bus_number: string;
  notes?: string;
}

export const usePickupDropHistory = (guardianProfileId: string | null) => {
  const [history, setHistory] = useState<PickupDropEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!guardianProfileId) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_guardian_pickup_drop_history', { 
            guardian_profile_id: guardianProfileId 
          });

        if (error) {
          console.error('Error loading pickup drop history:', error);
          toast({
            title: "Error",
            description: "Failed to load pickup/drop history",
            variant: "destructive",
          });
          return;
        }

        setHistory(data?.map(item => ({
          ...item,
          event_type: item.event_type as 'pickup' | 'drop'
        })) || []);
      } catch (error) {
        console.error('Error loading pickup drop history:', error);
        toast({
          title: "Error",
          description: "Failed to load pickup/drop history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    // Set up real-time subscription for new pickup/drop events
    const channel = supabase
      .channel('pickup_drop_history_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pickup_drop_history',
          filter: `student_id=in.(${history.map(h => h.student_id).join(',')})`
        },
        (payload) => {
          console.log('New pickup/drop event:', payload);
          // Reload history to get the complete data with joins
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [guardianProfileId, toast]);

  return {
    history,
    loading
  };
};