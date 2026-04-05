import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  student_id: string;
  student_name: string;
  driver_id?: string;
  driver_name?: string;
  bus_number?: string;
}

interface FeedbackFormProps {
  guardianProfileId: string;
  students: Student[];
  onFeedbackSubmitted?: () => void;
}

const feedbackTypes = [
  { value: 'compliment', label: 'Compliment', icon: '👍' },
  { value: 'complaint', label: 'Complaint', icon: '⚠️' },
  { value: 'suggestion', label: 'Suggestion', icon: '💡' },
  { value: 'safety_concern', label: 'Safety Concern', icon: '🚨' },
  { value: 'general', label: 'General Feedback', icon: '💬' }
];

export const FeedbackSubmissionForm: React.FC<FeedbackFormProps> = ({
  guardianProfileId,
  students,
  onFeedbackSubmitted
}) => {
  const [formData, setFormData] = useState({
    student_id: '',
    feedback_type: '',
    title: '',
    description: '',
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.feedback_type || !formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('parent_feedback')
        .insert({
          guardian_profile_id: guardianProfileId,
          student_id: formData.student_id,
          feedback_type: formData.feedback_type,
          title: formData.title,
          description: formData.description,
          rating: formData.rating,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback. We'll review it shortly.",
      });

      // Reset form
      setFormData({
        student_id: '',
        feedback_type: '',
        title: '',
        description: '',
        rating: 5
      });

      onFeedbackSubmitted?.();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStudent = students.find(s => s.student_id === formData.student_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Submit Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Student *</label>
            <Select 
              value={formData.student_id} 
              onValueChange={(value) => setFormData({...formData, student_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your child" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.student_id} value={student.student_id}>
                    {student.student_name} 
                    {student.bus_number && ` - Bus ${student.bus_number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Driver Info Display */}
          {selectedStudent && selectedStudent.driver_name && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Driver: {selectedStudent.driver_name}</p>
              <p className="text-sm text-muted-foreground">Bus: {selectedStudent.bus_number}</p>
            </div>
          )}

          {/* Feedback Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Feedback Type *</label>
            <Select 
              value={formData.feedback_type} 
              onValueChange={(value) => setFormData({...formData, feedback_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      {type.icon} {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Overall Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  className="p-1"
                >
                  <Star 
                    className={`h-6 w-6 ${
                      star <= formData.rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.rating}/5 stars
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Subject *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Brief summary of your feedback"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Details *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Please provide detailed feedback..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};