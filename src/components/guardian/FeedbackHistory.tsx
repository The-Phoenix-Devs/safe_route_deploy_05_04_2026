import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  title: string;
  description: string;
  feedback_type: string;
  rating: number;
  status: string;
  admin_response?: string;
  response_date?: string;
  created_at: string;
}

interface FeedbackHistoryProps {
  guardianProfileId: string;
}

export const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({
  guardianProfileId
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (guardianProfileId) {
      fetchFeedbacks();
    }
  }, [guardianProfileId]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parent_feedback')
        .select('*')
        .eq('guardian_profile_id', guardianProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error: any) {
      console.error('Error fetching feedback history:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: "destructive",
      in_progress: "secondary",
      resolved: "default",
      closed: "outline"
    };
    
    const icons: Record<string, any> = {
      open: Clock,
      in_progress: MessageSquare,
      resolved: CheckCircle,
      closed: CheckCircle
    };

    const Icon = icons[status];
    
    return (
      <Badge variant={variants[status]}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            My Feedback History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            My Feedback History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No feedback submitted yet</p>
            <p className="text-sm">Submit your first feedback above!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          My Feedback History ({feedbacks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{feedback.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {getRatingStars(feedback.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({feedback.rating}/5)
                    </span>
                  </div>
                </div>
                {getStatusBadge(feedback.status)}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {feedback.description}
              </p>
              
              {feedback.admin_response && (
                <div className="bg-green-50 p-3 rounded-md">
                  <h5 className="font-medium text-green-800 text-sm mb-1">Response:</h5>
                  <p className="text-sm text-green-700">{feedback.admin_response}</p>
                  {feedback.response_date && (
                    <p className="text-xs text-green-600 mt-1">
                      {format(new Date(feedback.response_date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {feedback.feedback_type.replace('_', ' ').toUpperCase()}
                </Badge>
                <span>{format(new Date(feedback.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};